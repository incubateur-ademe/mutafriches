import data1 from "./fixtures/v1.0/test-01-oyonnax.json";
import data2 from "./fixtures/v1.0/test-02-allegre.json";
import data3 from "./fixtures/v1.0/test-03-montbeugny.json";
import data4 from "./fixtures/v1.0/test-04-port-brillet.json";
import data5 from "./fixtures/v1.0/test-05-renaison.json";
import data6 from "./fixtures/v1.0/test-06-segre.json";
import data7 from "./fixtures/v1.0/test-07-saint-julien.json";
import data8 from "./fixtures/v1.0/test-08-thouars.json";
import data9 from "./fixtures/v1.0/test-09-trelaze.json";
import data10 from "./fixtures/v1.0/test-10-villeurbanne.json";

import { TestCase } from "./types/test-case.types";

// Cast des données JSON vers le type TestCase
export const testCases: TestCase[] = [
  data1 as TestCase,
  data2 as TestCase,
  data3 as TestCase,
  data4 as TestCase,
  data5 as TestCase,
  data6 as TestCase,
  data7 as TestCase,
  data8 as TestCase,
  data9 as TestCase,
  data10 as TestCase,
];
