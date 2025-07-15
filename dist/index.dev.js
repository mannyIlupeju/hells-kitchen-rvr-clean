"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var express_1 = __importDefault(require("express"));

var cors_1 = __importDefault(require("cors"));

var UserRoutes_1 = __importDefault(require("./src/presentation/routes/UserRoutes"));

var app = (0, express_1["default"])();
app.use((0, cors_1["default"])({
  origin: 'http://localhost:3000'
}));
app.use(express_1["default"].json());
app.use('/api/hells-kitchen-connect', UserRoutes_1["default"]);
app.listen(5000, function () {
  console.log("Backend server running on http://localhost:5000");
});
//# sourceMappingURL=index.dev.js.map
