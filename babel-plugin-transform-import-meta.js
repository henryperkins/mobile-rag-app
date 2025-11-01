// Simple Babel plugin that turns `import.meta` into { url: <safe fallback> }
module.exports = function({ types: t }) {
  return {
    name: "transform-import-meta",
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta.name !== "import" || property.name !== "meta") return;

        const windowDefined = t.binaryExpression(
          "!==",
          t.unaryExpression("typeof", t.identifier("window")),
          t.stringLiteral("undefined")
        );
        const windowHref = t.memberExpression(
          t.memberExpression(t.identifier("window"), t.identifier("location")),
          t.identifier("href")
        );
        const selfDefined = t.binaryExpression(
          "!==",
          t.unaryExpression("typeof", t.identifier("self")),
          t.stringLiteral("undefined")
        );
        const selfHref = t.memberExpression(
          t.memberExpression(t.identifier("self"), t.identifier("location")),
          t.identifier("href")
        );
        const fallback = t.stringLiteral("app://local");

        path.replaceWith(
          t.objectExpression([
            t.objectProperty(
              t.identifier("url"),
              t.conditionalExpression(
                windowDefined,
                windowHref,
                t.conditionalExpression(selfDefined, selfHref, fallback)
              )
            )
          ])
        );
      }
    }
  };
};
