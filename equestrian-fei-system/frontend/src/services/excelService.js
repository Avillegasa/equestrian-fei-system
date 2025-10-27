import * as XLSX from 'xlsx';

/**
 * Servicio de Importación/Exportación de Excel
 * Maneja la lectura y escritura de tablas de cómputos FEI
 */

// ==================== IMPORTACIÓN ====================

/**
 * Lee un archivo Excel y lo convierte a JSON
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Leer la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        resolve({
          workbook,
          sheetNames: workbook.SheetNames,
          data: jsonData,
          sheet: firstSheet
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parsea una tabla de cómputos de Adiestramiento
 * Detecta automáticamente el formato FEI
 */
export const parseDressageTable = (excelData) => {
  const { data } = excelData;

  // Detectar estructura de la tabla
  const exercises = [];
  const collectiveMarks = [];
  let maxScore = 0;
  let tableName = 'Tabla Importada';

  // Buscar título de la tabla (primeras filas)
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row[0] && typeof row[0] === 'string' && row[0].length > 10) {
      tableName = row[0];
      break;
    }
  }

  // Buscar sección de ejercicios
  let inExercisesSection = false;
  let inCollectiveSection = false;
  let exerciseNumber = 1;
  let collectiveNumber = 1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '').toLowerCase();

    // Detectar inicio de ejercicios
    if (firstCell.includes('exercise') || firstCell.includes('ejercicio') || firstCell.includes('movement')) {
      inExercisesSection = true;
      inCollectiveSection = false;
      continue;
    }

    // Detectar inicio de notas de conjunto
    if (firstCell.includes('collective') || firstCell.includes('conjunto') || firstCell.includes('general')) {
      inExercisesSection = false;
      inCollectiveSection = true;
      collectiveNumber = 1;
      continue;
    }

    // Parsear ejercicios
    if (inExercisesSection) {
      // Buscar número, descripción, coeficiente
      const number = parseInt(row[0]) || exerciseNumber;
      const description = row[1] || row[0] || `Ejercicio ${number}`;
      const coefficient = parseInt(row[row.length - 1]) || 1;

      if (description && description.length > 0) {
        exercises.push({
          number: number,
          maxNote: 10,
          coefficient: coefficient,
          description: String(description)
        });

        maxScore += 10 * coefficient;
        exerciseNumber++;
      }
    }

    // Parsear notas de conjunto
    if (inCollectiveSection) {
      const description = row[1] || row[0];
      const coefficient = parseInt(row[row.length - 1]) || 1;

      if (description && description.length > 5) {
        collectiveMarks.push({
          number: collectiveNumber,
          name: String(description),
          maxNote: 10,
          coefficient: coefficient
        });

        maxScore += 10 * coefficient;
        collectiveNumber++;
      }
    }
  }

  // Si no se detectaron ejercicios, usar valores por defecto
  if (exercises.length === 0) {
    console.warn('No se detectaron ejercicios en el Excel, usando estructura básica');
    return createBasicDressageTemplate(tableName);
  }

  return {
    id: `imported_${Date.now()}`,
    name: tableName,
    description: 'Tabla importada desde Excel',
    maxScore: maxScore,
    exercises: exercises,
    collectiveMarks: collectiveMarks
  };
};

/**
 * Crea una plantilla básica si la importación falla
 */
const createBasicDressageTemplate = (name) => {
  return {
    id: `basic_${Date.now()}`,
    name: name || 'Tabla Básica',
    description: 'Plantilla básica de adiestramiento',
    maxScore: 100,
    exercises: Array.from({ length: 8 }, (_, i) => ({
      number: i + 1,
      maxNote: 10,
      coefficient: 1,
      description: `Ejercicio ${i + 1}`
    })),
    collectiveMarks: [
      { number: 1, name: 'Aires', maxNote: 10, coefficient: 1 },
      { number: 2, name: 'Impulsión', maxNote: 10, coefficient: 1 },
      { number: 3, name: 'Sumisión', maxNote: 10, coefficient: 1 }
    ]
  };
};

// ==================== EXPORTACIÓN ====================

/**
 * Exporta calificaciones de una competencia a Excel
 */
export const exportCompetitionScores = (competition, participants, scores, judges) => {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen General
  const summarySheet = createSummarySheet(competition, participants, scores, judges);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Calificaciones Detalladas
  const scoresSheet = createScoresSheet(participants, scores, judges);
  XLSX.utils.book_append_sheet(workbook, scoresSheet, 'Calificaciones');

  // Hoja 3: Ranking Final
  const rankingSheet = createRankingSheet(participants, scores);
  XLSX.utils.book_append_sheet(workbook, rankingSheet, 'Ranking');

  // Generar archivo
  const fileName = `${competition.name}_Resultados_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
};

/**
 * Crea la hoja de resumen
 */
const createSummarySheet = (competition, participants, scores, judges) => {
  const data = [
    ['REPORTE DE COMPETENCIA FEI'],
    [],
    ['Competencia:', competition.name],
    ['Disciplina:', competition.discipline],
    ['Ubicación:', competition.location],
    ['Fecha Inicio:', competition.startDate || competition.start_date],
    ['Fecha Fin:', competition.endDate || competition.end_date],
    [],
    ['ESTADÍSTICAS'],
    ['Total Participantes:', participants.length],
    ['Total Calificaciones:', scores.length],
    ['Total Jueces:', judges.length],
    ['Porcentaje Completado:', `${Math.round((scores.length / participants.length) * 100)}%`],
    [],
    ['JUECES ASIGNADOS'],
    ['Nombre', 'Posición', 'Rol', 'Estado']
  ];

  // Agregar jueces
  judges.forEach(judge => {
    data.push([
      `${judge.staff_member.first_name} ${judge.staff_member.last_name}`,
      judge.judge_position || 'N/A',
      judge.role === 'chief_judge' ? 'Juez Principal' : 'Juez',
      judge.is_confirmed ? 'Confirmado' : 'Pendiente'
    ]);
  });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Crea la hoja de calificaciones detalladas
 */
const createScoresSheet = (participants, scores, judges) => {
  const header = ['#', 'Jinete', 'Caballo', 'Categoría'];

  // Agregar columnas de jueces
  judges.forEach(judge => {
    header.push(`${judge.staff_member.first_name} (${judge.judge_position || 'J'})`);
  });
  header.push('Promedio', 'Posición');

  const data = [header];

  // Calcular promedios y ordenar
  const participantsWithScores = participants.map(p => {
    const participantScores = scores.filter(s => s.participant_id === p.id);

    let avgScore = 0;
    if (participantScores.length > 0) {
      const sum = participantScores.reduce((acc, s) => {
        return acc + (s.totalScore || s.final_score || 0);
      }, 0);
      avgScore = sum / participantScores.length;
    }

    return {
      participant: p,
      scores: participantScores,
      average: avgScore
    };
  });

  // Ordenar por promedio (mayor a menor para dressage, menor a mayor para jumping)
  const isDressage = scores.some(s => s.discipline === 'dressage');
  participantsWithScores.sort((a, b) => {
    if (isDressage) {
      return b.average - a.average; // Mayor es mejor
    } else {
      return a.average - b.average; // Menor es mejor
    }
  });

  // Agregar datos
  participantsWithScores.forEach((item, index) => {
    const row = [
      item.participant.bib_number || index + 1,
      `${item.participant.rider.first_name} ${item.participant.rider.last_name}`,
      item.participant.horse.name,
      item.participant.category || 'N/A'
    ];

    // Agregar calificaciones por juez
    judges.forEach(judge => {
      const score = item.scores.find(s => s.judge_id === judge.staff_member.id);
      if (score) {
        if (score.discipline === 'dressage') {
          row.push(`${score.totalScore} (${score.percentage}%)`);
        } else {
          row.push(score.final_score);
        }
      } else {
        row.push('-');
      }
    });

    // Promedio y posición
    row.push(item.average.toFixed(2));
    row.push(index + 1);

    data.push(row);
  });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Crea la hoja de ranking
 */
const createRankingSheet = (participants, scores) => {
  const data = [
    ['RANKING FINAL'],
    [],
    ['Posición', 'Dorsal', 'Jinete', 'Caballo', 'Puntuación', 'Notas']
  ];

  // Calcular y ordenar
  const rankings = participants.map(p => {
    const participantScores = scores.filter(s => s.participant_id === p.id);

    let avgScore = 0;
    let notes = '';

    if (participantScores.length > 0) {
      const sum = participantScores.reduce((acc, s) => {
        return acc + (s.totalScore || s.final_score || 0);
      }, 0);
      avgScore = sum / participantScores.length;
      notes = `${participantScores.length} jueces`;
    } else {
      notes = 'Sin calificar';
    }

    return {
      participant: p,
      average: avgScore,
      notes
    };
  });

  const isDressage = scores.some(s => s.discipline === 'dressage');
  rankings.sort((a, b) => isDressage ? b.average - a.average : a.average - b.average);

  rankings.forEach((item, index) => {
    data.push([
      index + 1,
      item.participant.bib_number || index + 1,
      `${item.participant.rider.first_name} ${item.participant.rider.last_name}`,
      item.participant.horse.name,
      item.average > 0 ? item.average.toFixed(2) : '-',
      item.notes
    ]);
  });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Exporta plantilla de calificación vacía
 */
export const exportBlankScoringTemplate = (template, participant) => {
  const workbook = XLSX.utils.book_new();

  const data = [
    [template.name],
    [],
    ['Jinete:', `${participant.rider.first_name} ${participant.rider.last_name}`],
    ['Caballo:', participant.horse.name],
    ['Dorsal:', participant.bib_number],
    [],
    ['EJERCICIOS'],
    ['#', 'Descripción', 'Coeficiente', 'Nota (0-10)', 'Subtotal']
  ];

  // Ejercicios
  template.exercises.forEach(ex => {
    data.push([
      ex.number,
      ex.description,
      ex.coefficient,
      '', // Espacio para nota
      '' // Se calculará
    ]);
  });

  data.push([]);
  data.push(['NOTAS DE CONJUNTO']);
  data.push(['#', 'Aspecto', 'Coeficiente', 'Nota (0-10)', 'Subtotal']);

  // Notas de conjunto
  template.collectiveMarks.forEach(cm => {
    data.push([
      cm.number,
      cm.name,
      cm.coefficient,
      '', // Espacio para nota
      '' // Se calculará
    ]);
  });

  data.push([]);
  data.push(['TOTAL', '', '', '', '']);
  data.push(['PORCENTAJE', '', '', '', '']);

  const sheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Calificación');

  const fileName = `Plantilla_${participant.rider.last_name}_${participant.bib_number}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
};

/**
 * Descarga una plantilla Excel de ejemplo para crear plantillas de calificación
 * Incluye 2 hojas: Ejercicios y Notas de Conjunto con ejemplos
 */
export const downloadTemplateExcelExample = () => {
  const workbook = XLSX.utils.book_new();

  // ==================== HOJA 1: EJERCICIOS ====================
  const exercisesData = [
    ['INSTRUCCIONES:', 'Complete esta tabla con los ejercicios de su plantilla de calificación. Puede agregar o eliminar filas según necesite.'],
    [],
    ['Número', 'Descripción del Ejercicio', 'Coeficiente', 'Puntuación Máxima'],
    [1, 'Entrada en paso trabajado. Alto e inmovilidad. Saludo', 1, 10],
    [2, 'Paso trabajado', 1, 10],
    [3, 'Trote trabajado elevándose al trote', 1, 10],
    [4, 'Círculo de 20m al trote trabajado', 2, 10],
    [5, 'Transición trote-paso', 1, 10],
    [6, 'Paso medio', 2, 10],
    [7, 'Transición paso medio-trote', 1, 10],
    [8, 'Círculo de 20m al trote trabajado', 2, 10],
    [9, 'Galope trabajado', 1, 10],
    [10, 'Círculo de 20m al galope trabajado', 2, 10],
    [11, 'Transición galope-trote', 1, 10],
    [12, 'Cambio de mano en diagonal al trote', 1, 10],
    [13, 'Galope trabajado y círculo', 2, 10],
    [14, 'Alto, retroceso, saludo', 1, 10],
    [],
    ['IMPORTANTE:', 'El coeficiente multiplica la puntuación (1, 2 o 3). Puntuación máxima típica: 10 puntos.']
  ];

  const exercisesSheet = XLSX.utils.aoa_to_sheet(exercisesData);

  // Ajustar anchos de columna
  exercisesSheet['!cols'] = [
    { wch: 10 },  // Número
    { wch: 60 },  // Descripción
    { wch: 12 },  // Coeficiente
    { wch: 18 }   // Puntuación Máxima
  ];

  XLSX.utils.book_append_sheet(workbook, exercisesSheet, 'Ejercicios');

  // ==================== HOJA 2: NOTAS DE CONJUNTO ====================
  const collectiveData = [
    ['INSTRUCCIONES:', 'Complete esta tabla con las notas de conjunto (evaluación general del binomio jinete-caballo).'],
    [],
    ['Aspecto a Evaluar', 'Coeficiente', 'Puntuación Máxima'],
    ['Aires (libertad y regularidad)', 1, 10],
    ['Impulsión (deseo de avanzar, elasticidad de los pasos)', 2, 10],
    ['Sumisión (atención y confianza, armonía, ligereza)', 1, 10],
    ['Posición y asiento del jinete, corrección de la posición', 1, 10],
    ['Corrección y efecto de las ayudas', 1, 10],
    [],
    ['IMPORTANTE:', 'Las notas de conjunto evalúan aspectos generales de la presentación, no ejercicios específicos.']
  ];

  const collectiveSheet = XLSX.utils.aoa_to_sheet(collectiveData);

  // Ajustar anchos de columna
  collectiveSheet['!cols'] = [
    { wch: 55 },  // Aspecto
    { wch: 12 },  // Coeficiente
    { wch: 18 }   // Puntuación Máxima
  ];

  XLSX.utils.book_append_sheet(workbook, collectiveSheet, 'Notas de Conjunto');

  // ==================== DESCARGAR ARCHIVO ====================
  const fileName = 'Plantilla_Calificacion_FEI_Ejemplo.xlsx';
  XLSX.writeFile(workbook, fileName);

  console.log(`✅ Plantilla Excel descargada: ${fileName}`);
  return fileName;
};
