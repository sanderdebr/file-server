const { parse } = require("url");
const { resolve, sep } = require("path");

// Get current directory
const baseDirectory = process.cwd();

async function notAllowed(request) {
  return {
    status: 405,
    body: `Method ${request.method} not allowed.`,
  };
}

// Transform request URL to path
function urlPath(url) {
  let { pathname } = parse(url);
  let path = resolve(decodeURIComponent(pathname).slice(1));
  if (path != baseDirectory && !path.startsWith(baseDirectory + sep)) {
    throw { status: 403, body: "Forbidden" };
  }
  return path;
}

// Wrapper that creates promise around outcome of calling pipe(), since pipe() does not return a promise
function pipeStream(from, to) {
  return new Promise((resolve, reject) => {
    from.on("error", reject); // request falls in error
    to.on("error", reject); // createWriteStream falls in error
    to.on("finish", resolve); // createWriteStream is ready
    from.pipe(to); // use pipe to move data from readable to writable stream
  });
}

module.exports = { notAllowed, urlPath, pipeStream };
