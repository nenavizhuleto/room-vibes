import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Redirect to the vanilla HTML app
    window.location.href = "/app.html";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f14]">
      <div className="text-center">
        <p className="text-xl text-gray-400">Redirecting to SoundBoard...</p>
      </div>
    </div>
  );
};

export default Index;
