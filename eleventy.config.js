module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats(["njk"]);
  eleventyConfig.addPassthroughCopy("src");
  eleventyConfig.addWatchTarget("src");
  eleventyConfig.addPassthroughCopy("src/icons");
  eleventyConfig.addWatchTarget("src/icons");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addWatchTarget("src/images");
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addWatchTarget("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addWatchTarget("src/scripts");

  eleventyConfig.addTransform("jsmin", async (content, path) => {
    if (path.endsWith(".js")) {
      return (await require("terser").minify(content)).code;
    }
    return content;
  });

  eleventyConfig.addTransform("htmlmin", async (content, path) => {
    if (
      process.env.NODE_ENV === "production" &&
      path.endsWith(".html")
    ) {
      return await require("html-minifier-terser").minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true,
      });
    }
    return content;
  });

  eleventyConfig.addPlugin(require("eleventy-plugin-postcss"), {
    plugins: [require("cssnano")],
  });

  return {
    dir: {
      input: "src",
      output: "build",
    },
  };
};
