"""Initial schema

Revision ID: e844c6de99f2
Revises:
Create Date: 2026-05-19 10:11:26.151643

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "e844c6de99f2"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline migration for an already-initialized PostGIS database.
    pass


def downgrade() -> None:
    pass
