const fs = require('fs');

const findYamlList = require('./find-yaml-list');

const posts = fs.readdirSync('./_posts');
const tags = posts.reduce((all, filename) => {

  const post = fs.readFileSync(`_posts/${filename}`, 'utf8');
  const tags = findYamlList(post, /tags:/);
  tags.forEach(tag => all.add(tag));
  return all;

}, new Set());

fs.readdirSync('tag/').forEach(filename => {
  fs.unlinkSync(`tag/${filename}`);
});

tags.forEach(tag => {
  const slug = tag.toLowerCase().replace(/\s+/g, '-');
  const contents = tagFileContents(tag);
  fs.writeFileSync(`tag/${slug}.html`, contents);
});

function tagFileContents(tag) {
  return `---
layout: default
title: Posts Tagged With ${tag}
classname: page-home
selectedtag: ${tag}
---
<h1 class="lined-block col span_6">Showing Posts Tagged With ${tag}</h1>

{% include post-list.html %}
`
}