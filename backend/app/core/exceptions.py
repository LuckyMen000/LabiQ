from enum import Enum
from typing import Any, Dict, Optional, Union

from fastapi.responses import JSONResponse


class ErrorCode(str, Enum):
    BAD_REQUEST = "BAD_REQUEST"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"

    USER_NOT_FOUND = "USER_NOT_FOUND"
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS"
    USER_INACTIVE = "USER_INACTIVE"

    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_TOKEN = "INVALID_TOKEN"

    SECURITY_INCIDENT_NOT_FOUND = "SECURITY_INCIDENT_NOT_FOUND"
    SECURITY_INCIDENT_ALREADY_EXISTS = "SECURITY_INCIDENT_ALREADY_EXISTS"


ErrorDetails = Optional[Union[Dict[str, Any], list, str]]


def build_error_content(
    *,
    code: Union[ErrorCode, str],
    message: str,
    details: ErrorDetails = None,
) -> Dict[str, Any]:
    return {
        "status": "error",
        "code": code.value if isinstance(code, ErrorCode) else code,
        "message": message,
        "details": details if details is not None else {},
    }


def error_response(
    *,
    status_code: int,
    code: Union[ErrorCode, str],
    message: str,
    details: ErrorDetails = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=build_error_content(
            code=code,
            message=message,
            details=details,
        ),
    )


class AppException(Exception):
    def __init__(
        self,
        message: str = "Ошибка приложения",
        code: Union[ErrorCode, str] = ErrorCode.BAD_REQUEST,
        status_code: int = 400,
        details: ErrorDetails = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details if details is not None else {}

        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        return build_error_content(
            code=self.code,
            message=self.message,
            details=self.details,
        )

    def to_response(self) -> JSONResponse:
        return JSONResponse(
            status_code=self.status_code,
            content=self.to_dict(),
        )


class BadRequestException(AppException):
    def __init__(
        self,
        message: str = "Некорректный запрос",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.BAD_REQUEST,
            status_code=400,
            details=details,
        )


class ValidationException(AppException):
    def __init__(
        self,
        message: str = "Некорректные данные",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.VALIDATION_ERROR,
            status_code=422,
            details=details,
        )


class UnauthorizedException(AppException):
    def __init__(
        self,
        message: str = "Необходима авторизация",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.UNAUTHORIZED,
            status_code=401,
            details=details,
        )


class ForbiddenException(AppException):
    def __init__(
        self,
        message: str = "Недостаточно прав для выполнения действия",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.FORBIDDEN,
            status_code=403,
            details=details,
        )


class NotFoundException(AppException):
    def __init__(
        self,
        message: str = "Запись не найдена",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.NOT_FOUND,
            status_code=404,
            details=details,
        )


class ConflictException(AppException):
    def __init__(
        self,
        message: str = "Конфликт данных",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.CONFLICT,
            status_code=409,
            details=details,
        )


class TooManyRequestsException(AppException):
    def __init__(
        self,
        message: str = "Слишком много запросов. Попробуйте позже",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.TOO_MANY_REQUESTS,
            status_code=429,
            details=details,
        )


class InternalServerException(AppException):
    def __init__(
        self,
        message: str = "Внутренняя ошибка сервера",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            status_code=500,
            details=details,
        )


class UserNotFoundException(NotFoundException):
    def __init__(
        self,
        message: str = "Пользователь не найден",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.USER_NOT_FOUND


class UserAlreadyExistsException(ConflictException):
    def __init__(
        self,
        message: str = "Пользователь с такими данными уже существует",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.USER_ALREADY_EXISTS


class UserInactiveException(ForbiddenException):
    def __init__(
        self,
        message: str = "Пользователь деактивирован",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.USER_INACTIVE


class InvalidCredentialsException(UnauthorizedException):
    def __init__(
        self,
        message: str = "Неверный логин или пароль",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.INVALID_CREDENTIALS


class TokenExpiredException(UnauthorizedException):
    def __init__(
        self,
        message: str = "Срок действия токена истёк",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.TOKEN_EXPIRED


class InvalidTokenException(UnauthorizedException):
    def __init__(
        self,
        message: str = "Недействительный токен",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.INVALID_TOKEN


class SecurityIncidentNotFoundException(NotFoundException):
    def __init__(
        self,
        message: str = "Инцидент безопасности не найден",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.SECURITY_INCIDENT_NOT_FOUND


class SecurityIncidentAlreadyExistsException(ConflictException):
    def __init__(
        self,
        message: str = "Инцидент безопасности уже существует",
        details: ErrorDetails = None,
    ):
        super().__init__(
            message=message,
            details=details,
        )
        self.code = ErrorCode.SECURITY_INCIDENT_ALREADY_EXISTS