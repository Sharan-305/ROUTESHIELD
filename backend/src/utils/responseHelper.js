/**
 * RouteShield — Standardized API Response Helper
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    statusCode,
    message,
    data
  });
};

const error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const payload = {
    status: 'error',
    statusCode,
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

const paginated = (res, items, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    status: 'success',
    statusCode: 200,
    message,
    data: {
      items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
};

module.exports = {
  success,
  error,
  paginated
};
