module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(require("eleventy-plugin-postcss"), {
    plugins: [require("cssnano")],
  });

  eleventyConfig.addTransform("jsmin", async (content, path) => {
    if (path.endsWith(".js")) {
      return (await require("terser").minify(content)).code;
    }
    return content;
  });

  eleventyConfig.addPassthroughCopy("src/scripts");

  return {
    dir: {
      input: "src",
      output: "build",
    },
  };
};
