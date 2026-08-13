from fastapi import Depends, HTTPException, status

from app.core.auth_dependency import get_current_user


def require_admin(
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )

    return current_user


def require_role(*roles: str):
    """
    Usage: current_user = Depends(require_role("admin", "external_supervisor"))
    """

    def dependency(
        current_user=Depends(get_current_user),
    ):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to: {', '.join(roles)}",
            )

        return current_user

    return dependency
