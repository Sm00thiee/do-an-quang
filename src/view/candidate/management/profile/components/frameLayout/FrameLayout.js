import Button from "react-bootstrap/Button";
import clsx from "clsx";

export default function FrameLayout({
  title,
  hasaddbtn,
  children,
  className,
  setActType,
}) {
  return (
    <div className={clsx("border border-2 rounded p-3 shadow-sm bg-white", className)}>
      <h5 className="d-inline">{title}</h5>
      {hasaddbtn && (
        <div className="d-inline float-end me-2">
          <Button variant="primary" size="sm" onClick={() => setActType("ADD")}>
            Thêm
          </Button>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
