"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NewsletterSubscriber = void 0;

var NewsletterSubscriber =
/*#__PURE__*/
function () {
  function NewsletterSubscriber(email, fullName, termsAgreed) {
    var createdAt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new Date();

    _classCallCheck(this, NewsletterSubscriber);

    this.email = email;
    this.fullName = fullName;
    this.requestingUpdate = this.requestingUpdate;
    this.termsAgreed = termsAgreed;
    this.createdAt = createdAt;

    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
  }

  _createClass(NewsletterSubscriber, [{
    key: "isValidEmail",
    value: function isValidEmail(email) {
      return /\S+@\S+\.\S+/.test(email);
    }
  }]);

  return NewsletterSubscriber;
}();

exports.NewsletterSubscriber = NewsletterSubscriber;
//# sourceMappingURL=Subscribers.dev.js.map
