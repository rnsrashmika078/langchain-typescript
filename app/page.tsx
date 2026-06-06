export default function Home() {
  const image = "./public/id.jpeg";
  const actPath = "C:\\Users\\Rashm\\OneDrive\\Desktop\\Sanbox3\\Test01";
  const path =
    "cd C:\\Users\\Rashm\\OneDrive\\Desktop\\Sanbox3\\Test01 && cd Test01 && npm run dev";
  const command = "cd Test01 && npm run dev";

  const modifiedCommand = command.includes(" && ")
    ? command
        .split(" && ")[0]
        .replace(command.split(" && ")[0], "cd " + actPath) +
      " && " +
      command.split(" && ")[1]
    : command;
  return (
    <pre className="text-xs items-center justify-center flex h-screen">
      {modifiedCommand}
    </pre>
  );
}
