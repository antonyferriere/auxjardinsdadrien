const htmlmin = require("html-minifier");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        minifyCSS: true,
      });
      return minified;
    }
    return content;
  });

  return {
    dir: {
      input: "src",
      layouts: "layouts",
      includes: "partials",
      output: "build",
    },
  };
};
