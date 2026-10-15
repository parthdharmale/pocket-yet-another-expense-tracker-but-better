'use client';

import {ThemeProvider,useTheme} from 'next-themes';
import {useSyncExternalStore,type ReactNode} from 'react';
import {SunMoon} from 'lucide-react';

const subscribe=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;

function ThemeChooser(){
 const {theme,setTheme}=useTheme();
 const ready=useSyncExternalStore(subscribe,clientReady,serverReady);
 return <label className="theme-chooser"><SunMoon size={17} aria-hidden="true"/><span className="sr-only">Appearance</span><select aria-label="Appearance" value={ready?theme??'system':'system'} disabled={!ready} onChange={event=>setTheme(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}

export default function AppTheme({children}:{children:ReactNode}){
 return <ThemeProvider attribute="data-theme" storageKey="pocket-theme" defaultTheme="system" enableSystem enableColorScheme disableTransitionOnChange>{children}<ThemeChooser/></ThemeProvider>;
}
