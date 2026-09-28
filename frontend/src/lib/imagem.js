// Reduz uma imagem selecionada pelo usuário para um data URL leve (evita ultrapassar o limite da API)
export function lerImagemComoDataUrlReduzida(arquivo, ladoMaximo = 300) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith('image/')) { reject(new Error('Selecione um arquivo de imagem.')); return; }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
      img.onload = () => {
        const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}
