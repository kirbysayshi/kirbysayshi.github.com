export default class NotFound {
  data() {
    return {
      layout: "layouts/default.11ty.tsx",
      title: "Uh oh!",
      classname: "page-404",
      permalink: "/404.html",
    };
  }

  render() {
    return <h1 className="lined-block col span_6">Sorry, the url wasn&apos;t found.</h1>;
  }
}
