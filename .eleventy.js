const htmlmin = require("html-minifier");
const nunjucks = require("nunjucks");

module.exports = function (eleventyConfig) {
  eleventyConfig.setLibrary(
    "njk",
    nunjucks.configure(["src/layouts", "src/partials", "src"])
  );
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

  // Surveille tout le dossier src pour le rechargement à chaud
  eleventyConfig.addWatchTarget("src");

  return {
    dir: {
      input: "src",
      layouts: "layouts",
      includes: "partials",
      output: "build",
    },
  };
};
