const fs = require('fs');
let code = fs.readFileSync('src/routes/StudentsPage.tsx', 'utf-8');

// Insert isFaculty and isAdmin at line 58
code = code.replace(
  `  const { data: scheduleData } = useQuery({`,
  `  const isFaculty = user?.roles?.includes('FACULTY');\n  const isAdmin = user?.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));\n\n  const { data: scheduleData } = useQuery({`
);

// Remove the old declarations
code = code.replace(
  `  const isFaculty = user?.roles?.includes('FACULTY');\n  const isAdmin = user?.roles?.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r));`,
  ``
);

// Show the class selector for everyone, not just faculty
code = code.replace(
  `{isFaculty && (\n            <div className="flex items-center gap-2 lg:ml-4">`,
  `<div className="flex items-center gap-2 lg:ml-4">`
);

// Remove the closing brace of the isFaculty condition for the class selector
code = code.replace(
  `              </select>\n            </div>\n          )}`,
  `              </select>\n            </div>`
);

// In the derived state list = [] if isFaculty should just be list = [] if not selected
code = code.replace(
  `    } else {\n      if (isFaculty) list = [];\n    }`,
  `    } else {\n      list = [];\n    }`
);

// Show the save attendance button for everyone if a class is selected
code = code.replace(
  `            {isFaculty && selectedClassId && (`,
  `            {selectedClassId && (`
);

// Update empty state string
code = code.replace(
  `{isFaculty && !selectedClassId`,
  `{!selectedClassId`
);

fs.writeFileSync('src/routes/StudentsPage.tsx', code);
