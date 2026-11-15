export async function seedDemo(apiUrl, webUrl) {
  async function send(module, data) {
    const response = await fetch(apiUrl + '/api/' + module, data && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('No se pudo preparar la demo de ' + module);
    return response.json();
  }

  const generos = await send('generos');
  const tipos = await send('tipos');
  const suspenso = await send('generos', {
    nombre: 'Suspenso', estado: 'Activo', descripcion: 'Historias con misterio y tension.',
  });
  const documental = await send('tipos', {
    nombre: 'Documental', descripcion: 'Producciones que narran hechos reales.',
  });

  const directores = [];
  for (const nombres of ['Lucia Vargas', 'Mateo Rios', 'Elena Andrade']) {
    directores.push(await send('directores', { nombres, estado: 'Activo' }));
  }
  await send('directores', { nombres: 'Camilo Duarte', estado: 'Inactivo' });

  const productoras = [];
  for (const [nombre, slogan, descripcion] of [
    ['Casa del Sur', 'Historias de nuestra tierra', 'Productora de cine independiente.'],
    ['Plano Norte', 'Otra forma de mirar', 'Estudio dedicado a series de ficcion.'],
    ['Raiz Documental', 'La vida en primer plano', 'Productora enfocada en naturaleza y cultura.'],
  ]) {
    productoras.push(await send('productoras', { nombre, slogan, descripcion, estado: 'Activo' }));
  }

  const ejemplos = [
    {
      serial: 'DEMO-001', titulo: 'El ultimo horizonte', anioEstreno: 2024,
      sinopsis: 'Una fotografa vuelve al desierto de su infancia y sigue el rastro de una familia que vive entre dos pueblos.',
      imagen: 'desierto', generoId: generos.find((row) => row.nombre === 'Drama').id,
      tipoId: tipos.find((row) => row.nombre === 'Pelicula').id,
    },
    {
      serial: 'DEMO-002', titulo: 'Ciudad de sombras', anioEstreno: 2025,
      sinopsis: 'Dos investigadores recorren la ciudad de madrugada para resolver una desaparicion.',
      imagen: 'ciudad', generoId: suspenso.id,
      tipoId: tipos.find((row) => row.nombre === 'Serie').id,
    },
    {
      serial: 'DEMO-003', titulo: 'Entre montanas', anioEstreno: 2023,
      sinopsis: 'Un recorrido por los Andes colombianos sigue a las comunidades que cuidan los bosques de niebla.',
      imagen: 'montana', generoId: generos.find((row) => row.nombre === 'Aventura').id,
      tipoId: documental.id,
    },
  ];
  for (const [index, { imagen, ...datos }] of ejemplos.entries()) {
    await send('media', {
      ...datos,
      directorId: directores[index].id,
      productoraId: productoras[index].id,
      portada: webUrl + '/demo/' + imagen + '.webp',
      url: 'https://example.com/producciones/' + imagen,
    });
  }
}
