const isValidToken = require("./isValidToken");
const { encryptPassword } = require("../../libs/encryption");
// const logger = require("../../libs/logger");

async function handlePageLoad(req, res) {
  // logger.info({
  //   message: "Incoming Request",
  //   method: req.method,
  //   url: req.originalUrl,
  //   body: req.body,
  // });

  if (req.method === "POST" && Object.keys(req.body).length > 0) {
    const domainAuthority = "nagarkaryavaliuat.com";
    const referrer = req.get("Referer") || "";

    // logger.info({
    //   message: "Referrer Check",
    //   referrer,
    //   expectedDomain: domainAuthority,
    // });

    try {
      const urlObj = new URL(referrer);
      const refAuthority = urlObj.host;

      // logger.info({
      //   message: "Parsed Authority",
      //   refAuthority,
      // });

      if (refAuthority === domainAuthority) {
        const { tokenno } = req.body;

        // logger.info({
        //   message: "Token Received",
        //   tokenLength: tokenno?.length,
        //   tokenPreview: tokenno?.substring(0, 25),
        // });

        if (!tokenno) {
          logger.warn("Token missing in request body");

          return res.send(
            "Invalid Token, Please Login With Your Credentials"
          );
        }

        const result = await isValidToken(tokenno);

        // logger.info({
        //   message: "Token Validation Result",
        //   result,
        // });

        if (result.isValid) {
          req.session.urlflag = 1;
          req.session.IsCalledPass = "Y";
          req.session.userid = result.userid;
          req.session.password = encryptPassword(result.password);

          // logger.info({
          //   message: "Session Created",
          //   userid: result.userid,
          // });

          return res.redirect("https://jwt.io/");
        }

        // logger.warn({
        //   message: "Invalid token or login failed",
        //   result,
        // });

        return res.send("Invalid token or login failed.");
      }

      // logger.warn({
      //   message: "Unauthorized Referrer",
      //   refAuthority,
      // });

      return res.send(
        "<b>UNAUTHORISED REQUEST</b>!<br/>Please contact admin or login manually."
      );
    } catch (err) {
      // logger.error({
      //   message: "handlePageLoad Error",
      //   error: err.message,
      //   stack: err.stack,
      // });

      return res.status(500).send("Internal server error");
    }
  }

  // logger.info("Rendering Login Page");

  req.session.userid = "";
  req.session.password = "";

  return res.render("login", {
    username: "",
    password: "",
  });
}

module.exports = handlePageLoad;