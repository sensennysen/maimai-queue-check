export function createMockReq({
  method = 'GET',
  query = {},
  headers = {},
  body = undefined,
} = {}) {
  return { method, query, headers, body };
}

export function createMockRes() {
  const state = {
    status: 200,
    headers: {},
    body: undefined,
  };

  return {
    setHeader(key, value) {
      state.headers[String(key).toLowerCase()] = value;
      return this;
    },
    status(code) {
      state.status = code;
      return this;
    },
    json(obj) {
      state.body = obj;
      return this;
    },
    send(body) {
      state.body = body;
      return this;
    },
    _state: state,
  };
}

