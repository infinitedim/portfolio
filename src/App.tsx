import Layout from "./components/Layout/Layout";
import Swal from 'sweetalert2';
import {useRef, useEffect} from 'react'

function App() {
  // const loadRef = useRef<HTMLElement>(null);

  // useEffect(() => {
  //   window?.addEventListener('load', () => {
  //     Swal.fire({
  //       icon: "error",
  //       title: "ใใใ๐",
  //       text: "ใใฎใใผใธใฏ้็บไธญใงใ",
  //       color: "#7765ff",
  //       background: "#102048",
  //     })
  //   });
  // }, []);
  return (
    <Layout/>
    );
}

export default App;
