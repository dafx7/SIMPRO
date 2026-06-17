import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def get_all_dosen() -> list[dict]:
    """
    Returns all users with role='DOSEN' and isActive=true.
    Fields: id, fullName, expertise, nidn
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, "fullName", expertise, nidn
                FROM "User"
                WHERE role = 'DOSEN' AND "isActive" = true
                """
            )
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_all_proposals() -> list[dict]:
    """
    Returns all proposals with status != 'DRAFT'.
    Fields: id, title, abstract, jurusan, status
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, title, abstract, jurusan, status
                FROM "Proposal"
                WHERE status != 'DRAFT'
                """
            )
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_proposal_by_id(proposal_id: str) -> dict | None:
    """
    Returns single proposal by id.
    Fields: id, title, abstract, jurusan, status, pembimbingId
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, title, abstract, jurusan, status, "pembimbingId"
                FROM "Proposal"
                WHERE id = %s
                """,
                (proposal_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def get_assigned_penguji(proposal_id: str) -> list[str]:
    """
    Returns list of pengujiId already assigned to this proposal.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT "pengujiId"
                FROM "ReviewerAssignment"
                WHERE "proposalId" = %s
                """,
                (proposal_id,),
            )
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


def update_similarity_flag(proposal_id: str, similarity_score: float, similarity_flag: bool) -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "Proposal"
                SET "similarityScore" = %s, "similarityFlag" = %s
                WHERE id = %s
                """,
                (similarity_score, similarity_flag, proposal_id),
            )
        conn.commit()
    finally:
        conn.close()
