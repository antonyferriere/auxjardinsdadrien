const nunjucks = require('nunjucks');

module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats(['njk']);
  eleventyConfig.setLibrary('njk', nunjucks.configure(['src/layouts', 'src/partials', 'src']));

  eleventyConfig.addWatchTarget('src');
  eleventyConfig.addPassthroughCopy('src/robots.txt');
  eleventyConfig.addWatchTarget('src/robots.txt');
  eleventyConfig.addPassthroughCopy('src/site.webmanifest');
  eleventyConfig.addWatchTarget('src/site.webmanifest');
  eleventyConfig.addPassthroughCopy('src/icons');
  eleventyConfig.addWatchTarget('src/icons');
  eleventyConfig.addPassthroughCopy('src/images');
  eleventyConfig.addWatchTarget('src/images');
  eleventyConfig.addPassthroughCopy('src/styles');
  eleventyConfig.addWatchTarget('src/styles');
  eleventyConfig.addPassthroughCopy('src/scripts');
  eleventyConfig.addWatchTarget('src/scripts');
  eleventyConfig.addPassthroughCopy({ 'src/forms': 'forms' });
  eleventyConfig.addWatchTarget('src/forms');

  eleventyConfig.addTransform('jsmin', async (content, path) => {
    if (path.endsWith('.js')) {
      return (await require('terser').minify(content)).code;
    }
    return content;
  });

  eleventyConfig.addTransform('htmlmin', async (content, path) => {
    if (process.env.NODE_ENV === 'production' && path.endsWith('.html')) {
      return await require('html-minifier-terser').minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true,
        removeAttributeQuotes: true,
        minifyCSS: true,
      });
    }
    return content;
  });

  const postcssPlugin =
    require('eleventy-plugin-postcss').default || require('eleventy-plugin-postcss');
  eleventyConfig.addPlugin(postcssPlugin, {
    plugins: [require('cssnano')],
  });

  return {
    dir: {
      input: 'src',
      output: 'build',
      layouts: 'layouts',
      includes: 'partials',
    },
  };
};
