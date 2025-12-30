// pages/provider/services.js
import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

export default function ProviderServicesPage() {
  const [categories, setCategories] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [selectedSubcats, setSelectedSubcats] = useState([]);

  // request missing service
  const [showRequest, setShowRequest] = useState(false);
  const [reqCategoryName, setReqCategoryName] = useState("");
  const [reqSubcatName, setReqSubcatName] = useState("");
  const [reqNotes, setReqNotes] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("id,name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setCategories(data || []);
    })();
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      const { data } = await supabase
        .from("service_subcategories")
        .select("id,name")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setSubcats(data || []);
      setSelectedSubcats([]);
      const cat = categories.find((c) => c.id === categoryId);
      setReqCategoryName(cat?.name || "");
    })();
  }, [categoryId]);

  async function saveServices() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return alert("Not logged in");

    if (!selectedSubcats.length) return alert("Select at least 1 service");

    const rows = selectedSubcats.map((subcategory_id) => ({
      provider_id: uid,
      subcategory_id,
    }));

    const { error } = await supabase.from("provider_services").insert(rows);
    if (error) return alert(error.message);

    alert("Services saved!");
  }

  async function submitMissingService() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return alert("Not logged in");

    if (!reqCategoryName || !reqSubcatName) return alert("Fill category + service");

    const { error } = await supabase.from("custom_service_requests").insert({
      provider_id: uid,
      category_name: reqCategoryName,
      subcategory_name: reqSubcatName,
      notes: reqNotes,
    });

    if (error) return alert(error.message);

    setReqSubcatName("");
    setReqNotes("");
    setShowRequest(false);
    alert("Request sent for admin approval ✅");
  }

  function toggleSubcat(id) {
    setSelectedSubcats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <RequireRole role="provider">
      <div style={{ padding: 20 }}>
        <h2>Choose Your Services</h2>

        <label>Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {categoryId && (
          <>
            <h3>Subcategories (select all you offer)</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {subcats.map((s) => (
                <label key={s.id} style={{ display: "flex", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedSubcats.includes(s.id)}
                    onChange={() => toggleSubcat(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <button onClick={saveServices}>Save Services</button>{" "}
              <button onClick={() => setShowRequest(true)}>Can’t find my service</button>
            </div>
          </>
        )}

        {showRequest && (
          <div style={{ marginTop: 20, padding: 12, border: "1px solid #ccc" }}>
            <h3>Request a New Service (Admin approval)</h3>
            <div>
              <label>Category</label>
              <input value={reqCategoryName} onChange={(e) => setReqCategoryName(e.target.value)} />
            </div>
            <div>
              <label>Service name</label>
              <input value={reqSubcatName} onChange={(e) => setReqSubcatName(e.target.value)} />
            </div>
            <div>
              <label>Notes</label>
              <textarea value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} />
            </div>
            <button onClick={submitMissingService}>Submit</button>{" "}
            <button onClick={() => setShowRequest(false)}>Cancel</button>
          </div>
        )}
      </div>
    </RequireRole>
  );
}