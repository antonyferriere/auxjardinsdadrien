module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(require("eleventy-plugin-terser"));
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-postcss"), {
    plugins: [require("cssnano")]
  });

  return {
    dir: {
      input: "src",
      output: "build"
    }
  };
};
