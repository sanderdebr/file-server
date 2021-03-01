const { createServer } = require("http");
const { parse } = require("url");
const { resolve, sep } = require("path");
const { createReadStream, createWriteStream, mkdir, fstat } = require("fs");
const { stat, readdir, rmdir, unlink } = require("fs").promises;
const mime = require("mime");

// Methods object holds methods
const methods = Object.create(null);

// Get current directory
const baseDirectory = process.cwd();

// GET files or directories
methods.GET = async function (request) {
  let path = urlPath(request.url);
  let stats;
  try {
    stats = await stat(path); // Check if file or directory exists
  } catch (error) {
    if (error.code != "ENOENT") throw error;
    else return { status: 404, body: "File not found" };
  }
  if (stats.isDirectory()) {
    return { body: (await readdir(path)).join("\n") }; // Read directory
  } else {
    return { body: createReadStream(path), type: mime.getType(path) }; // Create readable stream and return as the body, with content-type from mime
  }
};

// Create a directory
methods.MKCOL = async function (request) {
  let path = urlPath(request.url);
  let stats;

  try {
    stats = await stat(path);

    if (stats.isFile() || stats.isDirectory()) {
      console.log("file or dir");
      return { status: 400 };
    }
  } catch (error) {
    mkdir(path, (err) => {
      console.log(err);
    });
    return { status: 204 };
  }
};

// DELETE files or directories
methods.DELETE = async function (request) {
  let path = urlPath(request.url);
  let stats;
  try {
    stats = await stat(path);
  } catch (error) {
    if (error.code != "ENOENT") throw error;
    else return { status: 204 };
  }
  if (stats.isDirectory()) await rmdir(path);
  else await unlink(path);
  return { status: 204 };
};

// PUT file: overwrite a file.
methods.PUT = async function (request) {
  let path = urlPath(request.url);
  await pipeStream(request, createWriteStream(path));
  return { status: 204 };
};

// Setup server
createServer((request, response) => {
  let handler = methods[request.method] || notAllowed; // if method not exists, run notAllowed
  handler(request) // Execute method
    .catch((error) => {
      // If  promise is rejected, return error object
      if (error.status != null) return error;
      return { body: String(error), status: 500 };
    })
    .then(({ body, status = 200, type = "text/plain" }) => {
      // Promise is resolved
      response.writeHead(status, { "Content-Type": type });
      if (body && body.pipe) body.pipe(response);
      //  If body is readable stream, it will have a pipe method to transform content from readable to writable stream.
      else response.end(body);
    });
}).listen(8000);

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
