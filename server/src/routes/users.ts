import { Router } from "express";
const router = Router();

/* GET users listing. */
router.get("/", function (req: any, res, next) {

  console.log("Test");
  // Here we can check the req.user.scope array contains the scope relevant for the REST API operation being invoked
  res.send("Successfully verified JWT token. Extracted information: " + JSON.stringify(req.user));
});

export default router;
