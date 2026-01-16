import { useAuth } from "../contexts/AuthContext";

function GetMyUID() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>UID Lekérdezés</h1>
        <p>Kérlek jelentkezz be először!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>A Te Firebase UID-d:</h1>
      <div
        style={{
          background: "#f0f0f0",
          padding: "1rem",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "1.2rem",
          marginTop: "1rem",
        }}
      >
        {user.uid}
      </div>
      <p style={{ marginTop: "1rem" }}>
        Másold ki ezt az UID-t és használd Document ID-ként a users
        collection-ben!
      </p>
      <hr style={{ margin: "2rem 0" }} />
      <h2>Email:</h2>
      <p>{user.email}</p>
      <h2>Név:</h2>
      <p>{user.displayName}</p>
    </div>
  );
}

export default GetMyUID;
