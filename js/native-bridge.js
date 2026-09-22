/**
 * Ponte Capacitor — detecta app nativo e gerencia token de autenticação.
 */
(function () {
  "use strict";

  var TOKEN_KEY = "setad_auth_token";

  function isNative() {
    return !!(window.Capacitor &&
      window.Capacitor.isNativePlatform &&
      window.Capacitor.isNativePlatform());
  }

  function getApiBase() {
    if (!isNative()) {
      return "/api";
    }

    var config = window.SETAD_CONFIG || {};
    if (config.API_BASE) {
      return String(config.API_BASE).replace(/\/$/, "");
    }

    return null;
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (_e) {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (_e) {}
  }

  function initNativeUi() {
    if (!isNative()) return;

    document.documentElement.classList.add("setad-native-app");

    if (window.Capacitor && window.Capacitor.Plugins) {
      var StatusBar = window.Capacitor.Plugins.StatusBar;
      if (StatusBar && StatusBar.setBackgroundColor) {
        StatusBar.setBackgroundColor({ color: "#23406b" });
      }
      if (StatusBar && StatusBar.setStyle) {
        StatusBar.setStyle({ style: "LIGHT" });
      }

      var SplashScreen = window.Capacitor.Plugins.SplashScreen;
      if (SplashScreen && SplashScreen.hide) {
        window.addEventListener("load", function () {
          setTimeout(function () {
            SplashScreen.hide();
          }, 600);
        });
      }
    }
  }

  window.SETADNative = {
    isNative: isNative,
    getApiBase: getApiBase,
    getToken: getToken,
    setToken: setToken,
    initNativeUi: initNativeUi
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNativeUi);
  } else {
    initNativeUi();
  }
})();
