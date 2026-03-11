'use client';
import React, { useEffect, useState } from "react";
import { supabaseBrowser } from '@/lib/supabase';
import AdminTopBar from "../../../components/admin/adminTopBar";
import { Bounds } from "@/types/region";
import CreateRegionModal from "@/components/admin/CreateRegionModal";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import RegionsList from "@/components/admin/RegionList";
import { Region } from "@/types/region";
import { User } from "@/types/user";

export default function AdminPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRegion, setNewRegion] = useState({ name: "", slug: "", dimension: "", owner: "" });
  const [confirmRemove, setConfirmRemove] = useState<{ regionId: string, userId: string } | null>(null);
  const [bounds, setBounds] = useState<Bounds>({
    min_x: 0,
    min_y: 0,
    min_z: 0,
    max_x: 0,
    max_y: 0,
    max_z: 0,
  });
  const supabase = supabaseBrowser();

  // Fetch regions and users
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const [regionsRes, usersRes] = await Promise.all([
        fetch("/api/admin/regions", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);
      const regionsJson = await regionsRes.json();
      const usersJson = await usersRes.json();
      // Ensure owners is always an array
      const safeRegions = (regionsJson.data || regionsJson.regions || []).map((r: Region) => ({
        ...r,
        owners: Array.isArray(r.owners) ? r.owners : [],
      }));
      setRegions(safeRegions);
      setUsers(usersJson.data || usersJson.users || []);
      setLoading(false);
    }
    fetchData();
  }, [supabase.auth]);

  // Create region handler
  async function handleCreateRegion(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch("/api/admin/regions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...newRegion,
        owners: [newRegion.owner],
        bounds: [bounds],
      }),
    });
    setShowCreate(false);
    setNewRegion({ name: "", slug: "", dimension: "", owner: "" });
    setBounds({
      min_x: 0,
      min_y: 0,
      min_z: 0,
      max_x: 0,
      max_y: 0,
      max_z: 0,
    });
    // Refresh regions
    const refreshHeaders: Record<string, string> = {};
    if (token) refreshHeaders['Authorization'] = `Bearer ${token}`;
    const regionsRes = await fetch("/api/admin/regions", { headers: refreshHeaders });
    const regionsJson = await regionsRes.json();
    const safeRegions = (regionsJson.data || regionsJson.regions || []).map((r: Region) => ({
      ...r,
      owners: Array.isArray(r.owners) ? r.owners : [],
    }));
    setRegions(safeRegions);
  }

  // Delete region handler
  async function handleDeleteRegion(id: string) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`/api/admin/regions/${id}`, { method: "DELETE", headers });
    setRegions(regions.filter(region => region.id !== id));
  }

  // Assign user as owner to region (add to region.owners)
  async function handleAssignOwnerToRegion(userId: string, region: Region) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const ownersArr = Array.isArray(region.owners) ? region.owners : [];
    if (ownersArr.includes(userId)) return;
    const updatedOwners = [...ownersArr, userId];

    await fetch(`/api/admin/regions/${region.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: region.name,
        slug: region.slug,
        dimension: region.dimension,
        owners: updatedOwners,
        bounds: region.bounds,
      }),
    });
    // Refresh regions
    const regionsRes = await fetch("/api/admin/regions", { headers });
    const regionsJson = await regionsRes.json();
    const safeRegions = (regionsJson.data || regionsJson.regions || []).map((r: Region) => ({
      ...r,
      owners: Array.isArray(r.owners) ? r.owners : [],
    }));
    setRegions(safeRegions);
  }

  // Remove owner from region (after confirmation)
  function handleRemoveOwnerFromRegion(region: Region, userId: string) {
    setConfirmRemove({ regionId: region.id, userId });
  }

  async function confirmRemoveOwner() {
    if (!confirmRemove) return;
    const { regionId, userId } = confirmRemove;
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    const ownersArr = Array.isArray(region.owners) ? region.owners : [];
    const updatedOwners = ownersArr.filter(id => id !== userId);

    // PATCH must send all required fields!
    await fetch(`/api/admin/regions/${region.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: region.name,
        slug: region.slug,
        dimension: region.dimension,
        owners: updatedOwners,
        bounds: region.bounds,
      }),
    });
    setConfirmRemove(null);
    // Refresh regions
    const regionsRes = await fetch("/api/admin/regions", { headers });
    const regionsJson = await regionsRes.json();
    const safeRegions = (regionsJson.data || regionsJson.regions || []).map((r: Region) => ({
      ...r,
      owners: Array.isArray(r.owners) ? r.owners : [],
    }));
    setRegions(safeRegions);
  }

  function getUserName(userId: string) {
    return users.find(u => u.id === userId)?.name || userId;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-0">
      <AdminTopBar onCreateRegionClick={() => setShowCreate(true)} />

      <CreateRegionModal
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateRegion}
        newRegion={newRegion}
        setNewRegion={setNewRegion}
        bounds={bounds}
        setBounds={setBounds}
      />

      <ConfirmDeleteModal
        show={!!confirmRemove}
        userName={confirmRemove ? getUserName(confirmRemove.userId) : ""}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={confirmRemoveOwner}
      />

      <RegionsList
        regions={regions}
        users={users}
        loading={loading}
        userName={getUserName}
        handleRemoveOwnerFromRegion={handleRemoveOwnerFromRegion}
        handleAssignOwnerToRegion={handleAssignOwnerToRegion}
        handleDeleteRegion={handleDeleteRegion}
      />
    </div>
  );
}