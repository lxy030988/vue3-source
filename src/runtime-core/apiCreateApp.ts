export function createAppAPI(render) {
  return (rootComponent) => {
    const app = {
      mount(container) {
        //和平台无关
      },
    };
    return app;
  };
}
