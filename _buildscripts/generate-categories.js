const fs = require('fs');
const findYamlList = require('./find-yaml-list');

const posts = fs.readdirSync('./_posts');
const categories = posts.reduce((all, filename) => {

  const post = fs.readFileSync(`_posts/${filename}`, 'utf8');
  const categories = findYamlList(post, /categories:/);
  categories.forEach(category => all.add(category));
  return all;

}, new Set());

fs.readdirSync('category/').forEach(filename => {
  fs.unlinkSync(`category/${filename}`);
});

categories.forEach(category => {
  const slug = category.toLowerCase().replace(/\s+/g, '-');
  const contents = categoryFileContents(category);
  fs.writeFileSync(`category/${slug}.html`, contents);
});

function categoryFileContents(category) {
  return `---
layout: default
title: Posts in ${category} category
classname: page-home
selectedcategory: ${category}
---
<h1 class="lined-block col span_6">Showing Posts in ${category}</h1>

{% include post-list.html %}
`
}