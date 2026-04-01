import { ErrorBoundary } from "./components/error-boundary";
import { Workbench } from "./components/workbench";

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <Workbench />
    </ErrorBoundary>
  );
}

export default App;
