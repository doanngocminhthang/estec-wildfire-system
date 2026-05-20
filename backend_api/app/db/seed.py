from app.core.security import hash_password
from app.db.database import SessionLocal
from app.db.models import Permission, Role, User

_DEFAULT_ROLES = [
    ("admin", "Quản trị hệ thống"),
    ("dispatcher", "Điều phối viên"),
    ("ranger", "Kiểm lâm viên"),
    ("citizen", "Công dân"),
]

_DEFAULT_PERMISSIONS = [
    ("view_incidents", "Xem sự cố"),
    ("create_incidents", "Tạo sự cố"),
    ("edit_incidents", "Chỉnh sửa sự cố"),
    ("delete_incidents", "Xóa sự cố"),
    ("view_users", "Xem người dùng"),
    ("manage_users", "Quản lý người dùng"),
    ("view_hotspots", "Xem điểm cháy"),
    ("view_analytics", "Xem phân tích"),
]


def seed_default_data() -> None:
    """Seed roles, permissions và admin user nếu chưa tồn tại."""
    db = SessionLocal()
    try:
        # Seed roles
        for name, desc in _DEFAULT_ROLES:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=desc))
        db.commit()

        # Seed permissions
        for name, desc in _DEFAULT_PERMISSIONS:
            if not db.query(Permission).filter(Permission.name == name).first():
                db.add(Permission(name=name, description=desc))
        db.commit()

        # Seed admin user
        if not db.query(User).filter(User.username == "admin").first():
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            admin = User(
                username="admin",
                email="admin@wildfire.local",
                hashed_password=hash_password("Admin@123"),
                is_active=True,
            )
            db.add(admin)
            db.flush()
            if admin_role:
                admin.roles.append(admin_role)
            db.commit()
            print("✅ Admin user created: admin / Admin@123")
        else:
            print("ℹ️  Admin user already exists")

    except Exception as exc:
        db.rollback()
        print(f"⚠️  Seeder error: {exc}")
    finally:
        db.close()
