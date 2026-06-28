import FileUploadComponent from './components/file-upload';
import ChatComponent from './components/chat';

export default function Home() {
  return (
    <div className="h-screen w-screen flex bg-slate-950 overflow-hidden">
      {/* Sidebar — Upload area */}
      <div className="w-[320px] min-w-[280px] h-screen border-r border-white/10 bg-slate-900/50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <FileUploadComponent />
        </div>
      </div>

      {/* Main — Chat area */}
      <div className="flex-1 h-screen">
        <ChatComponent />
      </div>
    </div>
  );
}
