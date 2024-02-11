
function preventBack (req, res, next) { //cache clearing for all request and responses
   // console.log("cache cleared");
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  )
  next();
  }
  

  module.exports = preventBack;