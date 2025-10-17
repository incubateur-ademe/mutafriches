import React, { useState } from "react";

interface SelectParcelleByIdProps {
  onParcelleIdChange: (identifiant: string) => void;
  onSwitchToMap?: () => void;
}

export const SelectParcelleById: React.FC<SelectParcelleByIdProps> = ({
  onParcelleIdChange,
  onSwitchToMap,
}) => {
  const [parcelId, setParcelId] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    const limited = cleaned.slice(0, 17);

    let formatted = "";
    let pos = 0;

    let deptCommune = limited.slice(0, 6);
    if (limited.length >= 6 && /^97[1-6]/.test(limited)) {
      deptCommune = limited.slice(0, 6);
      pos = 6;
    } else if (limited.length >= 5 && /^2[AB]/.test(limited)) {
      deptCommune = limited.slice(0, 5);
      pos = 5;
    } else if (limited.length >= 5) {
      deptCommune = limited.slice(0, 5);
      pos = 5;
    } else {
      formatted = limited;
      setParcelId(formatted);
      onParcelleIdChange(limited);
      return;
    }

    formatted = deptCommune;

    if (limited.length <= pos) {
      setParcelId(formatted);
      onParcelleIdChange(limited);
      return;
    }

    const reste = limited.slice(pos);
    let prefixeSection = "";
    let numeroStart = -1;

    for (let i = reste.length - 4; i >= 0; i--) {
      if (/^[0-9]{4}$/.test(reste.slice(i, i + 4))) {
        numeroStart = i;
        break;
      }
    }

    if (numeroStart > 0) {
      prefixeSection = reste.slice(0, numeroStart);
      formatted += " " + prefixeSection.slice(0, 3);
      if (prefixeSection.length > 3) {
        formatted += " " + prefixeSection.slice(3);
      }
      formatted += " " + reste.slice(numeroStart, numeroStart + 4);
    } else {
      if (reste.length > 0) {
        formatted += " " + reste.slice(0, 3);
      }
      if (reste.length > 3) {
        formatted += " " + reste.slice(3, 5);
      }
      if (reste.length > 5) {
        formatted += " " + reste.slice(5);
      }
    }

    setParcelId(formatted);
    onParcelleIdChange(limited);
  };

  const handleMapLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onSwitchToMap) {
      onSwitchToMap();
    }
  };

  return (
    <div className="fr-input-group">
      <label className="fr-label" htmlFor="parcel-id">
        <strong>Identifiant de parcelle</strong>
      </label>

      <p className="fr-text--sm fr-mt-1w fr-mb-1w">
        Entrer l'IDU (identifiant parcellaire unique) de la parcelle que vous voulez analyser. Si
        vous ne le connaissez pas,{" "}
        <a href="#" onClick={handleMapLinkClick} className="fr-link">
          recherchez la parcelle via notre carte
        </a>
        .
      </p>

      <span className="fr-hint-text fr-mb-2w">
        Format : code département + code commune + préfixe + section + numéro
      </span>

      <input
        className="fr-input"
        type="text"
        id="parcel-id"
        name="parcel-id"
        placeholder="Ex: 25056 000 IK 0102"
        value={parcelId}
        onChange={handleInputChange}
      />
    </div>
  );
};
