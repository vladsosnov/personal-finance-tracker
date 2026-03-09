export const graphQlDocsHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Financial Goals Tracker GraphQL Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@1.8.7/graphiql.min.css" />
    <style>
      body {
        margin: 0;
      }
      #graphiql {
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="graphiql">Loading...</div>
    <script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/graphiql@1.8.7/graphiql.min.js"></script>
    <script>
      const graphQLFetcher = async (graphQLParams) => {
        const response = await fetch("/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(graphQLParams),
        });
        return response.json();
      };

      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher: graphQLFetcher,
          defaultEditorToolsVisibility: true,
        }),
        document.getElementById("graphiql")
      );
    </script>
  </body>
</html>
`;
