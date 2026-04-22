import os
from datetime import datetime
import certifi

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    from bson.objectid import ObjectId
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False
    print("WARNING: pymongo not installed. Database features disabled.")

_client = None
_db = None


def get_db():
    """Get or create a MongoDB database connection."""
    global _client, _db

    if not MONGO_AVAILABLE:
        return None

    if _db is not None:
        return _db

    try:
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
        # Use certifi for Atlas SSL connections
        if "mongodb+srv" in mongo_uri or "mongodb.net" in mongo_uri:
            _client = MongoClient(mongo_uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        else:
            _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

        # Verify connection
        _client.admin.command('ping')
        _db = _client["tenderguard"]
        print("SUCCESS: MongoDB connected successfully.")

        # Ensure indexes exist for fast performance on Vendor Aggregations
        try:
            _db["evaluations"].create_index("top_vendors.company_name")
            _db["evaluations"].create_index("timestamp")
            _db["audit_logs"].create_index("timestamp")
        except Exception as idx_err:
            print(f"WARNING: Could not create indexes: {idx_err}")

        return _db
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"WARNING: MongoDB connection failed: {e}. Continuing without database.")
        return None
    except Exception as e:
        print(f"WARNING: MongoDB error: {e}. Continuing without database.")
        return None


def save_evaluation(officer_name, requirements, files_processed, evaluation_result):
    """
    Save a full evaluation result to MongoDB.
    Returns the inserted document ID as string, or None if DB unavailable.
    """
    db = get_db()
    if db is None:
        return None

    try:
        doc = {
            "officer_name": officer_name or "Anonymous",
            "timestamp": datetime.utcnow(),
            "requirements": requirements,
            "files_processed": files_processed,
            "total_evaluated": evaluation_result.get("total_evaluated", 0),
            "analysis_summary": evaluation_result.get("analysis_summary", ""),
            "financial_summary": evaluation_result.get("financial_summary", ""),
            "top_vendors": [
                {k: v for k, v in vendor.items() if k != "parsed_text"}  # don't store raw PDF text
                for vendor in evaluation_result.get("top_vendors", [])
            ]
        }
        result = db["evaluations"].insert_one(doc)
        return str(result.inserted_id)
    except Exception as e:
        print(f"DB save_evaluation error: {e}")
        return None


def write_audit_log(officer_name, action, evaluation_id, metadata=None):
    """
    Write an immutable audit log entry.
    action: 'EVALUATION', 'EXPORT', 'BID_AUTOMATION', etc.
    """
    db = get_db()
    if db is None:
        return None

    try:
        entry = {
            "timestamp": datetime.utcnow(),
            "officer_name": officer_name or "Anonymous",
            "action": action,
            "evaluation_id": evaluation_id,
            "metadata": metadata or {}
        }
        result = db["audit_logs"].insert_one(entry)
        return str(result.inserted_id)
    except Exception as e:
        print(f"DB write_audit_log error: {e}")
        return None


def get_audit_logs(limit=50):
    """Fetch the latest audit log entries."""
    db = get_db()
    if db is None:
        return []

    try:
        logs = list(
            db["audit_logs"]
            .find({}, {"_id": 0})
            .sort("timestamp", -1)
            .limit(limit)
        )
        # Convert datetime to ISO string for JSON serialization
        for log in logs:
            if "timestamp" in log:
                log["timestamp"] = log["timestamp"].isoformat() + "Z"
        return logs
    except Exception as e:
        print(f"DB get_audit_logs error: {e}")
        return []


def get_evaluation_history(limit=20):
    """Fetch the latest evaluation summaries (no raw text)."""
    db = get_db()
    if db is None:
        return []

    try:
        docs = list(
            db["evaluations"]
            .find({}, {"requirements": 1, "officer_name": 1,
                       "timestamp": 1, "files_processed": 1,
                       "analysis_summary": 1, "financial_summary": 1,
                       "top_vendors.company_name": 1, "top_vendors.match_score": 1,
                       "top_vendors.total_bid_value": 1, "top_vendors.l_rank": 1})
            .sort("timestamp", -1)
            .limit(limit)
        )
        for doc in docs:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].isoformat() + "Z"
        return docs
    except Exception as e:
        print(f"DB get_evaluation_history error: {e}")
        return []

def get_full_evaluation(eval_id):
    """Fetch a complete evaluation by its ID."""
    db = get_db()
    if db is None:
        return None

    try:
        doc = db["evaluations"].find_one({"_id": ObjectId(eval_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].isoformat() + "Z"
            return doc
        return None
    except Exception as e:
        print(f"DB get_full_evaluation error: {e}")
        return None

def get_vendor_stats():
    """
    Aggregate evaluation history to calculate vendor statistics.
    Returns: [{ company_name, total_bids, win_rate, average_score, average_bid_value }]
    """
    db = get_db()
    if db is None:
        return []
        
    try:
        pipeline = [
            {"$unwind": "$top_vendors"},
            {"$group": {
                "_id": "$top_vendors.company_name",
                "total_bids": {"$sum": 1},
                "wins": {"$sum": {"$cond": [{"$eq": ["$top_vendors.l_rank", 1]}, 1, 0]}},
                "average_score": {"$avg": "$top_vendors.match_score"},
                "average_bid_value": {"$avg": "$top_vendors.total_bid_value"}
            }},
            {"$project": {
                "_id": 0,
                "company_name": "$_id",
                "total_bids": 1,
                "wins": 1,
                "win_rate": {"$multiply": [{"$divide": ["$wins", "$total_bids"]}, 100]},
                "average_score": {"$round": ["$average_score", 1]},
                "average_bid_value": 1
            }},
            {"$sort": {"total_bids": -1, "wins": -1}}
        ]
        stats = list(db["evaluations"].aggregate(pipeline))
        return stats
    except Exception as e:
        print(f"DB get_vendor_stats error: {e}")
        return []
