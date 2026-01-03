"use client";

import { useState, useEffect } from "react";
import styles from "./profile.module.css";

interface SalaryInfoProps {
  user: any;
  onUpdate: () => void;
}

export default function SalaryInfo({ user, onUpdate }: SalaryInfoProps) {
  const [editMode, setEditMode] = useState(false);

  // Header Inputs
  const [wage, setWage] = useState(user.salary?.wage || 0);
  const [workingDays, setWorkingDays] = useState(user.salary?.workingDays || 5);
  const [breakTime, setBreakTime] = useState(user.salary?.breakTime || 1);

  // Config stored in state (could be DB in future)
  const [config, setConfig] = useState({
    basic: 50, // % of wage
    hra: 50, // % of basic
    sa: 4167, // fixed
    bonus: 8.33, // % of basic
    lta: 8.33, // % of basic
    pfRate: 12, // % of basic
    professionalTax: 200, // fixed
  });

  // Calculated Values
  const [components, setComponents] = useState({
    basic: 0,
    hra: 0,
    sa: 0,
    bonus: 0,
    lta: 0,
    fixed: 0,
    pfEmployee: 0,
    pfEmployer: 0,
  });

  useEffect(() => {
    if (user?.salary) {
      setWage(user.salary.wage || 0);
      setWorkingDays(user.salary.workingDays ?? 5);
      setBreakTime(user.salary.breakTime ?? 1);
      // Note: we are not syncing config (percentages) from DB yet as schema doesn't have it,
      // effectively resetting them to defaults on load.
    }
  }, [user]);

  useEffect(() => {
    calculateSalary();
  }, [wage, config]);

  const calculateSalary = () => {
    const w = parseFloat(wage);
    if (isNaN(w) || w === 0) return;

    // 1. Basic = % of Wage
    const basic = (w * config.basic) / 100;

    // 2. HRA = % of Basic
    const hra = (basic * config.hra) / 100;

    // 3. Standard Allowance (Fixed)
    const sa = config.sa;

    // 4. Bonus = % of Basic
    const bonus = (basic * config.bonus) / 100;

    // 5. LTA = % of Basic
    const lta = (basic * config.lta) / 100;

    // 6. Fixed Allowance = Wage - (Basic + HRA + SA + Bonus + LTA)
    let fixed = w - (basic + hra + sa + bonus + lta);
    if (fixed < 0) fixed = 0;

    // PF
    const pf = (basic * config.pfRate) / 100;

    setComponents({
      basic: parseFloat(basic.toFixed(2)),
      hra: parseFloat(hra.toFixed(2)),
      sa: parseFloat(sa.toFixed(2)),
      bonus: parseFloat(bonus.toFixed(2)),
      lta: parseFloat(lta.toFixed(2)),
      fixed: parseFloat(fixed.toFixed(2)),
      pfEmployee: parseFloat(pf.toFixed(2)),
      pfEmployer: parseFloat(pf.toFixed(2)),
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: {
            wage: parseFloat(wage),
            workingDays: parseFloat(workingDays),
            breakTime: parseFloat(breakTime),
            basic: components.basic,
            hra: components.hra,
            standardAllowance: components.sa,
            bonus: components.bonus,
            lta: components.lta,
            fixedAllowance: components.fixed,
            professionalTax: config.professionalTax,
            pfEmployee: components.pfEmployee,
            pfEmployer: components.pfEmployer,
          },
        }),
      });

      if (res.ok) {
        alert("Salary Updated");
        setEditMode(false);
        onUpdate();
      } else {
        alert("Failed to update");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderCompRow = (
    title: string,
    desc: string,
    value: number,
    configKey: keyof typeof config | null,
    suffix = "",
    isFixed = false
  ) => (
    <div className={styles.compRowCompact}>
      <div className={styles.compLabelCol}>
        <div className={styles.compTitle}>{title}</div>
        <div className={styles.compDesc}>{desc}</div>
      </div>
      <div className={styles.compValCol}>
        ₹ {value.toLocaleString()} / month
      </div>
      <div className={styles.compConfigCol}>
        {editMode && configKey && !isFixed ? (
          <div className={styles.inputGroupCompact}>
            <input
              type="number"
              value={config[configKey]}
              onChange={(e) =>
                setConfig({
                  ...config,
                  [configKey]: parseFloat(e.target.value),
                })
              }
            />{" "}
            %
          </div>
        ) : configKey ? (
          <span className={styles.percentageBadge}>{config[configKey]}%</span>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className={styles.salaryContainer}>
      {/* Header / Top Section */}
      <div className={styles.topSection}>
        <div className={styles.topLeft}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Month Wage</span>
            {editMode ? (
              <input
                type="number"
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                className={styles.wageInputCompact}
              />
            ) : (
              <span className={styles.wageValue}>
                ₹ {wage.toLocaleString()} / Month
              </span>
            )}
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Yearly Wage</span>
            <span className={styles.wageValue}>
              ₹ {(wage * 12).toLocaleString()} / Year
            </span>
          </div>
        </div>
        <div className={styles.topRight}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>
              No of working days in a week:
            </span>
            {editMode ? (
              <input
                type="number"
                value={workingDays}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val > 7) return;
                  if (val < 0) return;
                  setWorkingDays(val);
                }}
                max={7}
                min={0}
                className={styles.smallInput}
              />
            ) : (
              <span className={styles.fieldValue}>{workingDays}</span>
            )}
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Break Time:</span>
            {editMode ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <input
                  type="number"
                  value={breakTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > 10) return;
                    if (val < 0) return;
                    setBreakTime(val);
                  }}
                  max={10}
                  min={0}
                  className={styles.smallInput}
                />
              </div>
            ) : (
              <span className={styles.fieldValue}>{breakTime}</span>
            )}
            <span style={{ marginLeft: "5px", fontWeight: 500 }}>/ hrs</span>
          </div>
        </div>
        <div className={styles.actionArea}>
          <button
            className={editMode ? styles.saveBtn : styles.editBtn}
            onClick={editMode ? handleSave : () => setEditMode(true)}
          >
            {editMode ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* Main Content Grid */}
      <div className={styles.gridContainer}>
        {/* Left Column: Salary Components */}
        <div className={styles.leftCol}>
          <h3 className={styles.colHeader}>Salary Components</h3>

          {renderCompRow(
            "Basic Salary",
            "Define Basic salary from company cost",
            components.basic,
            "basic"
          )}
          {renderCompRow(
            "House Rent Allowance",
            "HRA provided to employees 50% of basic",
            components.hra,
            "hra"
          )}

          {/* Standard Allowance (Fixed handled slightly differently) */}
          <div className={styles.compRowCompact}>
            <div className={styles.compLabelCol}>
              <div className={styles.compTitle}>Standard Allowance</div>
              <div className={styles.compDesc}>
                Fixed amount provided to employee
              </div>
            </div>
            <div className={styles.compValCol}>
              ₹ {components.sa.toLocaleString()} / month
            </div>
            <div className={styles.compConfigCol}>
              {editMode ? (
                <div className={styles.inputGroupCompact}>
                  <input
                    type="number"
                    value={config.sa}
                    onChange={(e) =>
                      setConfig({ ...config, sa: parseFloat(e.target.value) })
                    }
                    style={{ width: "60px" }}
                  />
                </div>
              ) : (
                <span className={styles.percentageBadge}>Fixed</span>
              )}
            </div>
          </div>

          {renderCompRow(
            "Performance Bonus",
            "Variable amount paid during payroll",
            components.bonus,
            "bonus"
          )}
          {renderCompRow(
            "Leave Travel Allowance",
            "LTA is paid by the company",
            components.lta,
            "lta"
          )}

          {/* Fixed Allowance */}
          <div className={styles.compRowCompact}>
            <div className={styles.compLabelCol}>
              <div className={styles.compTitle}>Fixed Allowance</div>
              <div className={styles.compDesc}>Balancing figure from Wage</div>
            </div>
            <div className={styles.compValCol}>
              ₹ {components.fixed.toLocaleString()} / month
            </div>
          </div>
        </div>

        {/* Right Column: PF & Deductions */}
        <div className={styles.rightCol}>
          <h3 className={styles.colHeader}>Provident Fund (PF) Contribution</h3>

          <div className={styles.compRowCompact}>
            <div className={styles.compLabelCol}>
              <div className={styles.compTitle}>Employee</div>
              <div className={styles.compDesc}>
                PF calculated based on basic
              </div>
            </div>
            <div className={styles.compValCol}>
              ₹ {components.pfEmployee.toLocaleString()} / month
            </div>
            <div className={styles.compConfigCol}>
              {editMode ? (
                <div className={styles.inputGroupCompact}>
                  <input
                    type="number"
                    value={config.pfRate}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pfRate: parseFloat(e.target.value),
                      })
                    }
                  />{" "}
                  %
                </div>
              ) : (
                <span className={styles.percentageBadge}>{config.pfRate}%</span>
              )}
            </div>
          </div>

          <div className={styles.compRowCompact}>
            <div className={styles.compLabelCol}>
              <div className={styles.compTitle}>Employer</div>
              <div className={styles.compDesc}>
                PF calculated based on basic
              </div>
            </div>
            <div className={styles.compValCol}>
              ₹ {components.pfEmployer.toLocaleString()} / month
            </div>
            <div className={styles.compConfigCol}>
              <span className={styles.percentageBadge}>{config.pfRate}%</span>
            </div>
          </div>

          <h3 className={styles.colHeader} style={{ marginTop: "20px" }}>
            Tax Deductions
          </h3>

          <div className={styles.compRowCompact}>
            <div className={styles.compLabelCol}>
              <div className={styles.compTitle}>Professional Tax</div>
              <div className={styles.compDesc}>Deducted from gross salary</div>
            </div>
            <div className={styles.compValCol}>
              ₹ {config.professionalTax.toLocaleString()} / month
            </div>
            <div className={styles.compConfigCol}>
              {editMode ? (
                <div className={styles.inputGroupCompact}>
                  <input
                    type="number"
                    value={config.professionalTax}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        professionalTax: parseFloat(e.target.value),
                      })
                    }
                    style={{ width: "60px" }}
                  />
                </div>
              ) : (
                <span className={styles.percentageBadge}>Fixed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
