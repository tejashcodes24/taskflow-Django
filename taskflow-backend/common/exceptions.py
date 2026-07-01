"""
Custom exception handler so error responses keep the same shape Nest's
default HttpException filter produces: { "statusCode": ..., "message": ..., "error": ... }
"""
from rest_framework.views import exception_handler
from rest_framework import exceptions as drf_exceptions
from rest_framework import status


class ConflictException(drf_exceptions.APIException):
    """Equivalent of Nest's ConflictException (409)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Conflict'
    default_code = 'conflict'


_STATUS_TO_ERROR_NAME = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
}


def nest_style_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    status_code = response.status_code
    detail = response.data

    if isinstance(detail, dict) and 'detail' in detail and len(detail) == 1:
        message = detail['detail']
    elif isinstance(detail, list):
        message = detail
    else:
        message = detail

    response.data = {
        'statusCode': status_code,
        'message': message,
        'error': _STATUS_TO_ERROR_NAME.get(status_code, 'Error'),
    }
    return response
