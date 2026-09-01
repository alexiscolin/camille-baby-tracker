import styles from '../EventModal.module.css';

interface MedicationFieldsProps {
  medicationName: string;
  onMedicationNameChange: (value: string) => void;
  dose: string;
  onDoseChange: (value: string) => void;
  maxLength: number;
}

export function MedicationFields({
  medicationName,
  onMedicationNameChange,
  dose,
  onDoseChange,
  maxLength,
}: MedicationFieldsProps) {
  return (
    <>
      <div className={styles.field}>
        <label className={styles.label}>Medication name</label>
        <input
          type="text"
          value={medicationName}
          onChange={(e) => onMedicationNameChange(e.target.value.slice(0, maxLength))}
          placeholder="e.g. Vitamin D"
          required
          maxLength={maxLength}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Dose</label>
        <input
          type="text"
          value={dose}
          onChange={(e) => onDoseChange(e.target.value.slice(0, maxLength))}
          placeholder="e.g. 1 drop"
          required
          maxLength={maxLength}
        />
      </div>
    </>
  );
}
