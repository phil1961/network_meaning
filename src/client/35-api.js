/* ─────────────────────────────────────────────
   File: src/client/35-api.js
   File Version: 0.4.0
   ─────────────────────────────────────────────
   The only place the browser talks to the server. Relative URLs, so the
   app works under an IIS sub-path. Every failure is thrown as
   {code, message, status}. A 401 anywhere shows the sign-in card. */
const api = (function () {
  async function call(method, path, body, signal) {
    let res;
    try {
      res = await fetch("api" + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, signal, credentials: "same-origin" });
    } catch (e) {
      if (e && e.name === "AbortError") throw { code: "cancelled", message: "Stopped. Nothing was added.", status: 0 };
      throw { code: "network", message: "Couldn't reach the server. Is it running?", status: 0 };
    }
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (res.status === 401 && path !== "/login" && path !== "/signup") { showLogin(); throw { code: "signed_out", message: "Sign in first.", status: 401 }; }
    if (!res.ok) throw { code: data && data.error ? data.error.code : "http_" + res.status, message: data && data.error ? data.error.message : "Something went wrong on the server.", status: res.status };
    return data;
  }
  return {
    me: () => call("GET", "/me"),
    auth: () => call("GET", "/auth"),
    samples: () => call("GET", "/samples"),
    login: (email, password) => call("POST", "/login", { email, password }),
    signup: (email, password, code) => call("POST", "/signup", { email, password, code }),
    users: () => call("GET", "/admin/users"),
    addUser: (email, password, level) => call("POST", "/admin/users", { email, password, level }),
    changeUser: (id, body) => call("PATCH", "/admin/users/" + id, body),
    shareStream: (id, shared) => call("PATCH", "/streams/" + id, { shared }),
    logout: () => call("POST", "/logout"),
    listStreams: () => call("GET", "/streams"),
    getStream: id => call("GET", "/streams/" + id),
    createStream: body => call("POST", "/streams", body),
    renameStream: (id, name) => call("PATCH", "/streams/" + id, { name }),
    deleteStream: id => call("DELETE", "/streams/" + id),
    postAction: (id, step) => call("POST", "/streams/" + id + "/steps", step),
    ingest: (id, body, signal) => call("POST", "/streams/" + id + "/ingest", body, signal),
    analyze: (id, body) => call("POST", "/streams/" + id + "/analyze", body)
  };
})();
