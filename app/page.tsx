export default function Home() {
  const command =
    'Get-ChildItem -Path "C:\Users\Rashm\OneDrive\Desktop\sandbox" -Filter "src" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }';

  const wrongCommand =
    'Get-ChildItem -Path \"C:\Users\Rashm\OneDrive\Desktop\sandbox\" -Filter \"src\" -Recurse -ErrorAction SilentlyContinue';
  return (
    <pre className="text-xs">
      {wrongCommand.split(" ").map((s, idx) => {
        const modified = idx === 2 && s.charAt(0).replace("\\", "").charAt(s.length-1).replace("\\", "")

        return <div key={idx}>{s}</div>
      })}
      {wrongCommand}
    </pre>
  );
}
