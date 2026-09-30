/* ─────────────────────────────────────────────
   File: src/client/35-api.js
   File Version: 0.1.0
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
    if (res.status === 401 && path !== "/login") { showLogin(); throw { code: "signed_out", message: "Sign in first.", status: 401 }; }
    if (!res.ok) throw { code: data && data.error ? data.error.code : "http_" + res.status, message: data && data.error ? data.error.message : "Something went wrong on the server.", status: res.status };
    return data;
  }
  return {
    me: () => call("GET", "/me"),
    login: password => call("POST", "/login", { password }),
    logout: () => call("POST", "/logout"),
    listStreams: () => call("GET", "/streams"),
    getStream: id => call("GET", "/streams/" + id),
    createStream: body => call("POST", "/streams", body),
    renameStream: (id, name) => call("PATCH", "/streams/" + id, { name }),
    deleteStream: id => call("DELETE", "/streams/" + id),
    postAction: (id, step) => call("POST", "/streams/" + id + "/steps", step),
    ingest: (id, body, signal) => call("POST", "/streams/" + id + "/ingest", body, signal)
  };
})();
