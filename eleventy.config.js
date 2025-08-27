const { minify } = require("terser");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(require("terser"));
  eleventyConfig.addPlugin(require("eleventy-plugin-postcss"), {
    plugins: [require("cssnano")],
  });

  eleventyConfig.setTemplateFormats(["njk"]);
  eleventyConfig.addPassthroughCopy("src");
  eleventyConfig.addWatchTarget("src");

  return {
    dir: {
      input: "src",
      output: "build",
    },
  };
};
