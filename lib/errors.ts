export class WooError extends Error {
  code: string;
  status: number;
  data: Record<string, unknown>;

  constructor(code: string, message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.data = { status, ...data };
  }

  toJSON() {
    return { code: this.code, message: this.message, data: this.data };
  }
}

export const Errors = {
  authRequired: () =>
    new WooError(
      "woocommerce_rest_authentication_error",
      "Authentication required.",
      401
    ),
  authInvalid: () =>
    new WooError(
      "woocommerce_rest_authentication_error",
      "Consumer key or secret is invalid.",
      401
    ),
  cannotView: () =>
    new WooError(
      "woocommerce_rest_cannot_view",
      "Sorry, you cannot view this resource.",
      401
    ),
  cannotCreate: () =>
    new WooError(
      "woocommerce_rest_cannot_create",
      "Sorry, you are not allowed to create resources.",
      401
    ),
  cannotEdit: () =>
    new WooError(
      "woocommerce_rest_cannot_edit",
      "Sorry, you are not allowed to edit this resource.",
      401
    ),
  cannotDelete: () =>
    new WooError(
      "woocommerce_rest_cannot_delete",
      "Sorry, you are not allowed to delete this resource.",
      401
    ),
  invalidId: (resource: string) =>
    new WooError(
      `woocommerce_rest_${resource}_invalid_id`,
      "Invalid ID.",
      404
    ),
  invalidParam: (params: Record<string, string> = {}) =>
    new WooError(
      "woocommerce_rest_invalid_param",
      "Invalid parameter(s).",
      400,
      { params }
    ),
};
